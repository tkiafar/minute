<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Services\AuthenticatorService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Jetstream\Jetstream;

/** This won't be called in user is registering using publickey */
class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => $this->passwordRules(),
            'terms' => Jetstream::hasTermsAndPrivacyPolicyFeature() ? ['accepted', 'required'] : '',
        ])->validate();

        $name = AuthenticatorService::generateDisplayName();

        $user = User::create([
            'name' => $name,
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
        ]);

        auth()->login($user);

        return $user;
    }
}
