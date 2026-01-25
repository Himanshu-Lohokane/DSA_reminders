import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

export const PUT = requireAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, phoneNumber, github, linkedin } = await req.json();

    // Validate phone number format if provided
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (github) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin; // Allow empty string to remove it

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? phoneNumber.replace(/\s/g, '') : null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        leetcodeUsername: updatedUser.leetcodeUsername,
        github: updatedUser.github,
        linkedin: updatedUser.linkedin,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});